# frozen_string_literal: true

require "bibtex"

# Exposes _bibliography/papers.bib as site.data["papers"] so pages (e.g. the
# research map) can use the same entries, keywords and dates as the Papers list.
module PapersData
  class Generator < Jekyll::Generator
    safe true
    priority :highest

    def generate(site)
      path = File.join(site.source, "_bibliography", "papers.bib")
      return unless File.exist?(path)

      site.data["papers"] = BibTeX.open(path).map { |e| paper(e) }
    end

    private

    def field(entry, name)
      value = entry[name]
      value.nil? ? nil : value.to_s.gsub(/[{}]/, "").strip
    end

    def paper(entry)
      doi = field(entry, :doi)
      eprint = field(entry, :eprint)
      {
        "key" => entry.key.to_s,
        "title" => field(entry, :title),
        "authors" => entry.author.map { |a| short_name(a) },
        "year" => field(entry, :year),
        "date" => field(entry, :sortdate),
        "journal" => field(entry, :journal),
        "keywords" => (field(entry, :keywords) || "").split(";").map(&:strip).reject(&:empty?),
        "url" => if doi && !doi.start_with?("10.48550")
                   "https://doi.org/#{doi}"
                 elsif eprint
                   "https://arxiv.org/abs/#{eprint}"
                 end
      }
    end

    def short_name(name)
      initials = name.first.to_s.split(/[\s-]+/).map { |n| "#{n[0]}." }.join(" ")
      "#{initials} #{name.last}".strip
    end
  end
end
